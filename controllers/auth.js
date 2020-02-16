const User = require('../models/user')
const Blog = require('../models/blog')
const shortId = require('shortid')
const jwt = require('jsonwebtoken')
const expressJwt = require('express-jwt')
const { errorHandler } = require('../helpers/dbErrorHandler')
const _ = require('lodash')
// sendgrid
const sgMail = require('@sendgrid/mail'); // SENDGRID_API_KEY
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.preSignup = (req, res) => {
    const { name, email, password } = req.body

    User.findOne({ email: email.toLowerCase() }, (err, user) => {
        if (user) {
            return res.status(400).json({
                error: 'Email déjà pris'
            })
        }
        const token = jwt.sign({ name, email, password }, process.env.JWT_ACCOUNT_ACTIVATION, { expiresIn: '10m' })

        // email
        const emailData = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: `Activation de votre compte`,
            html: `
            <p>Veuillez cliquer sur le lien suivant pour activer votre compte :</p>
            <p>${process.env.CLIENT_URL}/auth/account/activate/${token}</p>
            <hr />
            <p>Cet email peut contenir des informations importantes pour vous</p>
            <p>https://devium.com</p>
        `
        };

        sgMail.send(emailData).then(sent => {
            return res.json({
                message: `Un email a été envoyé à ${email}. Veuillez suivre les instructions indiquées.`
            })
        })
    })
}

// exports.signup = (req, res) => {
//     User
//         .findOne({ email: req.body.email })
//         .exec((err, user) => {
//             if(user) {
//                 return res.status(400).json({
//                     error: 'Email is taken'
//                 })
//             }

//             const { name, email, password } = req.body
//             let username = shortId.generate()
//             let profile = `${process.env.CLIENT_URL}/profile/${username}`

//             let newUser = new User({ name, email, password, profile, username })
//             newUser.save((err, success) => {
//                 if(err) {
//                     return res.status(400).json({
//                         error: err
//                     })
//                 }
//                 /*res.json({
//                     user: success
//                 })*/
//                 res.json({
//                     message: 'Signup success ! Please signin.'
//                 })
//             })
//         })
// }

exports.signup = (req, res) => {
    const token = req.body.token;
    if (token) {
        jwt.verify(token, process.env.JWT_ACCOUNT_ACTIVATION, function(err, decoded) {
            if (err) {
                return res.status(401).json({
                    error: 'Lien expiré. Veuillez recommencer.'
                });
            }

            const { name, email, password } = jwt.decode(token);

            let username = shortId.generate();
            let profile = `${process.env.CLIENT_URL}/profile/${username}`;

            const user = new User({ name, email, password, profile, username });
            user.save((err, user) => {
                if (err) {
                    return res.status(401).json({
                        error: errorHandler(err)
                    });
                }
                return res.json({
                    message: 'Inscription réussie ! Veuillez vous connecter'
                });
            });
        });
    } else {
        return res.json({
            message: 'Une erreur a eu lieu. Veuillez recommencer'
        });
    }
};

exports.signin = (req, res) => {
    const { email, password } = req.body
    // check if user exists
    User.findOne({ email }).exec((err, user) => {
        if(err || !user) {
            return res.status(400).json({
                error: "Cet email n'est lié à aucun utilisateur. Veuillez vous inscrire"
            })
        }
        // authenticate
        if(!user.authenticate(password)) {
            return res.status(400).json({
                error: "L'email et le mot de passe ne correspondent pas"
            })
        }
    
        // generate a token and send to client
        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' })

        res.cookie('token', token, { expiresIn: '1d' })
        const { _id, username, name, email, role } = user
        return res.json({
            token, user: { _id, username, name, email, role }
        })
    })
}

exports.signout = (req, res) => {
    res.clearCookie('token')
    res.json({
        message: 'Déconnexion réussie'
    })
}

exports.requireSignin = expressJwt({
    secret: process.env.JWT_SECRET
})

exports.authMiddleware = (req, res, next) => {
    const authUserId = req.user._id
    User.findById({ _id: authUserId }).exec((err, user) => {
        if (err || !user) {
            return res.status(400).json({
                error: 'Utilisateur introuvable'
            })
        }
        req.profile = user
        next()
    })
}

exports.adminMiddleware = (req, res, next) => {
    const adminUserId = req.user._id
    User.findById({ _id: adminUserId }).exec((err, user) => {
        if (err || !user) {
            return res.status(400).json({
                error: 'Utilisateur introuvable'
            })
        }

        if(user.role !== 1) {
            return res.status(400).json({
                error: "Contenu d'administrateur. Accès refusé"
            })
        }

        req.profile = user
        next()
    })
}

exports.canUpdateDeleteBlog = (req, res, next) => {
    const slug = req.params.slug.toLowerCase()
    Blog.findOne({ slug }).exec((err, data) => {
        if(err) {
            return res.status(400).json({
                error: errorHandler(err)
            })
        }
        let authorizedUser = data.postedBy._id.toString() === req.profile._id.toString()
        if(!authorizedUser) {
            return res.status(400).json({
                error: "Vous n'êtes pas autorisé"
            })
        }
        next()
    })
}

exports.forgotPassword = (req, res) => {
    const { email } = req.body;

    User.findOne({ email }, (err, user) => {
        if (err || !user) {
            return res.status(401).json({
                error: "Cet email n'est lié à aucun utilisateur"
            });
        }

        const token = jwt.sign({ _id: user._id }, process.env.JWT_RESET_PASSWORD, { expiresIn: '10m' });

        // email
        const emailData = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: `Réinitialisez votre mot de passe`,
            html: `
            <p>Veuillez cliquer sur le lien suivant pour réinitialiser votre mot de passe :</p>
            <p>${process.env.CLIENT_URL}/auth/password/reset/${token}</p>
            <hr />
            <p>Cet email peut contenir des informations importantes pour vous</p>
            <p>https://devium.com</p>
        `
        };
        // populating the db > user > resetPasswordLink
        return user.updateOne({ resetPasswordLink: token }, (err, success) => {
            if (err) {
                return res.json({ error: errorHandler(err) });
            } else {
                sgMail.send(emailData).then(sent => {
                    return res.json({
                        message: `Un email a été envoyé à ${email}. Veuillez les instructions indiquées. Ce lien expire dans 10 minutes.`
                    });
                });
            }
        });
    });
};

exports.resetPassword = (req, res) => {
    const { resetPasswordLink, newPassword } = req.body;

    if (resetPasswordLink) {
        jwt.verify(resetPasswordLink, process.env.JWT_RESET_PASSWORD, function(err, decoded) {
            if (err) {
                return res.status(401).json({
                    error: 'Lien expiré. Veuillez recommencer'
                });
            }
            User.findOne({ resetPasswordLink }, (err, user) => {
                if (err || !user) {
                    return res.status(401).json({
                        error: 'Une erreur a eu lieu. Veuillez réessayer plus tard'
                    });
                }
                const updatedFields = {
                    password: newPassword,
                    resetPasswordLink: ''
                };

                user = _.extend(user, updatedFields);

                user.save((err, result) => {
                    if (err) {
                        return res.status(400).json({
                            error: errorHandler(err)
                        });
                    }
                    res.json({
                        message: `Félicitation ! Vous pouvez maintenant vous connecter avec votre nouveau mot de passe`
                    });
                });
            });
        });
    }
};