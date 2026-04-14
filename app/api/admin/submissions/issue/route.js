import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import nodemailer from 'nodemailer';
import path from 'path';
import { requireAuth } from '@/lib/auth';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(req) {
  try {
    const auth = await requireAuth(['admin']);
    if (auth.error) {
      return new Response(JSON.stringify({ error: auth.error }), { status: auth.status });
    }

    const { submissionId } = await req.json();
    if (!submissionId) {
      return new Response(JSON.stringify({ error: 'Missing submissionId' }), { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'ssi_portal');

    const sub = await db.collection('submissions').findOne({ _id: new ObjectId(submissionId) });
    if (!sub || sub.status !== 'evaluated') {
      return new Response(JSON.stringify({ error: 'Invalid submission or not evaluated' }), { status: 400 });
    }

    if (sub.mailSent) {
      return new Response(JSON.stringify({ error: 'Email already sent' }), { status: 400 });
    }

    const exam = await db.collection('exams').findOne({ _id: sub.examId });
    const student = await db.collection('students').findOne({ _id: sub.studentId });

    if (!exam || !student) {
      return new Response(JSON.stringify({ error: 'Orphaned submission data' }), { status: 400 });
    }

    if (sub.passed) {
      // Send Passed Email with Certificate
      const outputPath = path.join(process.cwd(), 'public', 'certs', `cert_${sub._id.toString()}.png`);

      try {
        const mailOptions = {
          from: process.env.SMTP_FROM,
          to: student.email,
          subject: `Study Smart Innovations - Your ${exam.batch} Exam Results`,
          text: `Hello ${student.name},\n\nYou scored ${sub.score}% on your recent exam. Congratulations on passing!\nPlease find your certificate attached.`,
          attachments: [
            {
               filename: `${exam.batch}_Certificate.png`,
               path: outputPath
            }
          ]
        };

        await transporter.sendMail(mailOptions);
        
        // Log to issued_certificates
        if (sub.certId) {
          // Check if it already exists to prevent duplicate logs on error retry
          const existingLog = await db.collection('issued_certificates').findOne({ certId: sub.certId });
          if (!existingLog) {
            await db.collection('issued_certificates').insertOne({
               certId: sub.certId,
               studentId: student._id,
               studentEmail: student.email,
               name: student.name,
               examId: exam._id,
               course: exam.batch,
               issuedAt: new Date()
            });
          }
        }
      } catch (err) {
        console.error("Mail send error:", err);
        return new Response(JSON.stringify({ error: 'Failed to send certificate email' }), { status: 500 });
      }
    } else {
      // Send Failure Email
      try {
          const mailOptions = {
            from: process.env.SMTP_FROM,
            to: student.email,
            subject: `Study Smart Innovations - Your ${exam.batch} Exam Results`,
            text: `Hello ${student.name},\n\nYou scored ${sub.score}% on your recent exam. Unfortunately, this does not meet the passing criteria.\nYou can try again if you have remaining attempts.`,
          };
          await transporter.sendMail(mailOptions);
      } catch (err) {
         console.error("Mail send error:", err);
         return new Response(JSON.stringify({ error: 'Failed to send failure email' }), { status: 500 });
      }
    }

    await db.collection('submissions').updateOne(
      { _id: sub._id },
      { $set: { mailSent: true } }
    );

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (error) {
    console.error('Issue API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
