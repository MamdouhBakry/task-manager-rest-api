const User = require("../models/user");
const UserVerification = require("../models/userVerification");
const jwt = require('jsonwebtoken');
const shortid = require('shortid');
const bcrypt = require('bcrypt');
const express = require('express');
const router = express.Router();
// mail handler
const nodemailer = require('nodemailer');

// unique string
const { v4: uuidv4 } = require("uuid");

// env variables
require('dotenv').config();
// path for static verified page
const path = require('path');
const { log } = require("console");

// nodemailer stuff
let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASS
    }
})
// testing success

transporter.verify((error, success) => {
    if (error) {
        console.log(error);
    } else {
        console.log('Ready For Message');
        console.log(success);
    }
})
// function to generate web token
const generateJwtToken = (_id, role) => {
    return jwt.sign({ _id, role }, process.env.JWT_SECRET, {
        expiresIn: "1d",
    });
};

// send verification emai function
const sendVerificationEmail = ({ _id, email }, res) => {
    // url to be used in the email
    // const currentUrl = "http://localhost:5000/api/";
    const uniqueString = uuidv4() + _id;
    // mail options
    const mailOptions = {
        from: process.env.AUTH_EMAIL,
        to: email,
        subject: "Verify Your Email",
        html: `<p>verify your email address to complete the signup and login to your acount.</p>
        <p>this link <b> expire in 6 houres</b></p><p>press <a href=${"user/verify/" + _id + "/" + uniqueString}>here</a> to proceed</p>`
    }
    // hash the unique string
    const saltRounds = 10;
    bcrypt.hash(uniqueString, saltRounds)
        .then((hashedUniqueString) => {
            const newVerification = new UserVerification({
                userId: _id,
                uniqueString: hashedUniqueString,
                createdAt: Date.now(),
                expireAt: Date.now() + 21600000
            })
            newVerification.save()
                .then(() => {
                    transporter.sendMail(mailOptions)
                        .then(() => {
                            // email sent and verification record saved
                            res.json({
                                status: "PENDING",
                                message: "Verification email sent"
                            })
                        })
                        .catch((error) => {
                            console.log(error);
                            res.json({
                                status: "FAILED",
                                message: "Verification email failed"
                            })
                        })
                })
                .catch((error) => {
                    console.log(error);
                    res.json({
                        status: "FAILED",
                        message: "Could'not Save verification email data."
                    })
                })
        })
        .catch(() => {
            res.json({
                status: "FAILED",
                message: "An error occured while hashing an email data"
            })
        })
}
// verify email
exports.verifyEmail = (req, res) => {
    let { userId, uniqueString } = req.params;
    UserVerification
        .find({ userId })
        .then((result) => {
            if (result.length > 0) {
                // user verification record exists so wee proceed

                const { expireAt } = res[0];
                const hashedUniqueString = result[0].uniqueString;
                if (expireAt < Date.now()) {
                    UserVerification
                        .deleteOne({ userId })
                        .then((result) => {
                            User
                                .deleteOne({ _id: userId })
                                .then(() => {
                                    let message = "Link has expired Please signup again";
                                    res.redirect(`/user/verified/error=true&message=${message}`);
                                })
                                .catch((error) => {
                                    console.log(error);
                                    let message = "Clearing User with expired unique string failed";
                                    res.redirect(`/user/verified/error=true&message=${message}`);
                                })
                        })
                        .catch((error) => {
                            console.log(error);
                            let message = "An error occured while clearing expired user verification record";
                            res.redirect(`/user/verified/error=true&message=${message}`);
                        })
                }
                else {
                    // Valid record exist so we validate the user string
                    // First complete the hashsed unque string
                    bcrypt
                        .compare(uniqueString, hashedUniqueString)
                        .then((result) => {
                            if (result) {
                                // String match

                                User
                                    .updateOne({ _id: userId }, { verified: true })
                                    .then(() => {
                                        UserVerification
                                            .deleteOne({ userId })
                                            .then(() => {
                                                res.sendFile(path.join(__dirname, "./../views/verified.html"))
                                            })
                                            .catch((error) => {
                                                console.log(error);
                                                let message = "An error occured while finalizing successful verification";
                                                res.redirect(`/user/verified/error=true&message=${message}`);
                                            })
                                    })
                                    .catch((error) => {
                                        console.log(error);
                                        let message = "An error occured while updating user record to show verified";
                                        res.redirect(`/user/verified/error=true&message=${message}`);
                                    })
                            } else {
                                // existing record but incorrect verification details passed;
                                let message = "Invaild verification details passed. Check your inbox";
                                res.redirect(`/user/verified/error=true&message=${message}`);
                            }
                        })
                        .catch((error) => {
                            console.log(error);
                            let message = "An error occured while comparing unique string";
                            res.redirect(`/user/verified/error=true&message=${message}`);
                        })

                }

            } else {
                // user verification record doesn't exists
                let message = "Acount result doesn't exists or has been verified already. Please signup or login";
                res.redirect(`/user/verified/error=true&message=${message}`);
            }
        })
        .catch((error) => {
            console.log(error);
            let message = "An error occured while checking for existing user verification record";
            res.redirect(`/user/verified/error=true&message=${message}`)
        })
}


// verified page route
exports.verifiedEmail = (req, res) => {
    res.sendFile(path.join(__dirname, "./../views/verified.html"));
}
//  User SignUp Function
exports.signup = (req, res) => {
    console.log(req.body);
    User.findOne({ email: req.body.email }).exec(async (error, user) => {
        if (user)
            return res.status(400).json({
                message: "User allready registered",
            });
        const { firstName, lastName, email, password } = req.body;
        const hash_password = await bcrypt.hash(password, 10);
        const _user = new User({
            firstName,
            lastName,
            email,
            hash_password,
            userName: shortid.generate(),
            role: "user",
            verified: false
        });

        _user.save((error, user) => {
            if (error) {
                return res.status(400).json({
                    message: "something went wromg",
                });
            }
            if (user) {
                // handle acount verification 
                sendVerificationEmail(user, res);
                const token = generateJwtToken(user._id, user.role);
                const { _id, firstName, lastName, email, role, fullName } = user;
                return res.status(201).json({
                    token,
                    user: { _id, firstName, lastName, email, role, fullName },
                });
            }
        });
    });
};

// User SignIn Function
exports.signin = (req, res) => {
    User.findOne({ email: req.body.email }).exec(async (error, user) => {
        if (error) return res.status(400).json({ error });
        if (user) {
            console.log(user);
            const isPassword = await user.authenticate(req.body.password);
            if (isPassword && user.role === "user") {
                const token = generateJwtToken(user._id, user.role);
                const { _id, firstName, lastName, email, role, fullName } = user;
                res.status(200).json({
                    token,
                    user: { _id, firstName, lastName, email, role, fullName },
                });
            } else {
                return res.status(400).json({
                    message: "Something went wrong",
                });
            }

        } else {
            return res.status(400).json({ message: "Something went wrong" });
        }
    });
};

// User SignOut Function
exports.signout = (req, res) => {
    res.clearCookie("token");
    res.status(200).json({
        message: "Signout successfully",
    });
};
