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
          cc: 'hirugoswami2015@gmail.com',
          subject: `✨ Your Course Certificate: ${exam.batch} - Study Smart Innovations`,
          html: `
            <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px;">
              <h2 style="color: #0f172a;">Congratulations, ${student.name}! 🎉</h2>
              <p>We are thrilled to inform you that you have successfully passed the <strong>${exam.batch}</strong> examination with an outstanding score of <strong>${sub.score}%</strong>.</p>
              <p>Your hard work and dedication have truly paid off. Please find your official Certificate of Completion safely attached to this email.</p>
              <p>We wish you the absolute best in your future endeavors and hope to see you thriving in your career!</p>
              <br/>
              <p>Warm regards,</p>
              <p><strong>Hiranmoy Goswami</strong><br/>Founder, Study Smart Innovations</p>
            </div>
          `,
          attachments: [
            {
               filename: `SSI_${exam.batch.replace(/\\s+/g, '_')}_Certificate.png`,
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
            cc: 'hirugoswami2015@gmail.com',
            subject: `Examination Results: ${exam.batch} - Study Smart Innovations`,
            html: `
              <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px;">
                <h2 style="color: #0f172a;">Hello ${student.name},</h2>
                <p>Thank you for participating in the <strong>${exam.batch}</strong> examination. Your final score for this attempt is <strong>${sub.score}%</strong>.</p>
                <p>Unfortunately, this score currently falls short of the minimum passing criteria required for certification.</p>
                <p>Please do not be discouraged! We encourage you to thoroughly review the course material and practice exercises. You may attempt the exam again directly from your student dashboard if you have remaining attempts.</p>
                <br/>
                <p>We firmly believe in your potential and wish you the best of luck on your next attempt.</p>
                <p>Warm regards,</p>
                <p><strong>Hiranmoy Goswami</strong><br/>Founder, Study Smart Innovations</p>
              </div>
            `,
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
