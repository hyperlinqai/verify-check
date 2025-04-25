const nodemailer = require('nodemailer');

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers
    };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: 'Method not allowed' })
    };
  }

  try {
    // Parse the request body
    const body = JSON.parse(event.body);
    const { name, company, email, phone, service } = body;

    console.log('Form submission received:', { name, email, phone, service });

    // Validate required fields
    if (!name || !email || !phone) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: 'Required fields missing' })
      };
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER || 'verifykart2@gmail.com',
        pass: process.env.EMAIL_PASS || 'zccp glnf bxcu ogqz'
      },
      tls: {
        rejectUnauthorized: false,
        ciphers: 'SSLv3'
      }
    });

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER || 'verifykart2@gmail.com',
      to: process.env.EMAIL_USER || 'verifykart2@gmail.com',
      subject: 'New Form Submission from VerifyCheck Website',
      html: `
        <h2>New Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Company:</strong> ${company || 'Not provided'}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Service Needed:</strong> ${service || 'Not specified'}</p>
        <p><strong>Submission Time:</strong> ${new Date().toLocaleString()}</p>
      `,
      text: `New Form Submission\nName: ${name}\nCompany: ${company || 'Not provided'}\nEmail: ${email}\nPhone: ${phone}\nService Needed: ${service || 'Not specified'}\nSubmission Time: ${new Date().toLocaleString()}`
    };

    try {
      console.log('Attempting to send email...');
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully: ', info.response);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'Form submitted successfully' })
      };
    } catch (emailError) {
      console.error('Detailed email error:', JSON.stringify(emailError, null, 2));
      
      // Try with a different configuration as fallback
      try {
        console.log('Trying fallback email configuration...');
        const fallbackTransporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER || 'verifykart2@gmail.com',
            pass: process.env.EMAIL_PASS || 'zccp glnf bxcu ogqz'
          }
        });
        
        const fallbackInfo = await fallbackTransporter.sendMail(mailOptions);
        console.log('Fallback email sent successfully: ', fallbackInfo.response);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, message: 'Form submitted successfully via fallback' })
        };
      } catch (fallbackError) {
        console.error('Fallback email also failed:', fallbackError);
        
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ 
            success: false, 
            message: 'Failed to submit form. Please try again later.',
            error: process.env.NODE_ENV === 'development' ? emailError.message : 'Email service unavailable'
          })
        };
      }
    }
  } catch (error) {
    console.error('General error in form submission:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: 'Failed to process form submission' })
    };
  }
};
