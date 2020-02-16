// sendgrid
const sgMail = require('@sendgrid/mail'); // SENDGRID_API_KEY
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.contactForm = (req, res) => {
    const { email, name, message } = req.body;
    // console.log(req.body);

    const emailData = {
        to: process.env.EMAIL_TO,
        from: email,
        subject: `Vous avez reçu un message - ${process.env.APP_NAME}`,
        text: `Vous avez reçu un message de la part de \n Nom : ${name} \n Email : ${email} \n Message: ${message}`,
        html: `
            <h4>Vous avez reçu un message de la part de :</h4>
            <p>Nom : ${name}</p>
            <p>Email : ${email}</p>
            <p>Message : ${message}</p>
            <hr />
            <p>Cet email peut contenir des informations importantes pour vous</p>
            <p>https://devium.com</p>
        `
    };

    sgMail.send(emailData).then(sent => {
        return res.json({
            success: true
        });
    });
};

exports.contactBlogAuthorForm = (req, res) => {
    const { authorEmail, email, name, message } = req.body;
    // console.log(req.body);

    let maillist = [authorEmail, process.env.EMAIL_TO];

    const emailData = {
        to: maillist,
        from: email,
        subject: `Vous avez reçu un message - ${process.env.APP_NAME}`,
        text: `Vous avez reçu un message de la part de \n Nom : ${name} \n Email : ${email} \n Message: ${message}`,
        html: `
            <h4>Vous avez reçu un message de la part de :</h4>
            <p>Nom : ${name}</p>
            <p>Email : ${email}</p>
            <p>Message : ${message}</p>
            <hr />
            <p>Cet email peut contenir des informations importantes pour vous</p>
            <p>https://devium.com</p>
        `
    };

    sgMail.send(emailData).then(sent => {
        return res.json({
            success: true
        });
    });
};