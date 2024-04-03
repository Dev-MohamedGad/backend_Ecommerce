import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import User from "../../../DB/Models/user.model.js";
import sendEmailService from "../../services/send-email.service.js";

import { OAuth2Client } from "google-auth-library";
import userModel from "../../../DB/Models/user.model.js";

// ========================================= SignUp API ================================//

export const signUp = async (req, res, next) => {
  // 1- destructure the required data from the request body
  const { username, email, password, age, role, phoneNumbers, addresses } =
    req.body;

  // 2- check if the user already exists in the database using the email
  const isEmailDuplicated = await User.findOne({ email });
  if (isEmailDuplicated) {
    return next(
      new Error("Email already exists,Please try another email", { cause: 409 })
    );
  }
  // 3- send confirmation email to the user
  const usertoken = jwt.sign({ email }, process.env.JWT_SECRET_VERFICATION, {
    expiresIn: "2m",
  });

  const isEmailSent = await sendEmailService({
    to: email,
    subject: "Email Verification",
    message: `
        <h2>please click on this link to verfiy your email</h2>
        <a href="${req.protocol}://${req.headers.host}/auth/verify-email?token=${usertoken}">Verify Email</a>
        `,
  });
  // 4- check if email is sent successfully
  if (!isEmailSent) {
    return next(
      new Error("Email is not sent, please try again later", { cause: 500 })
    );
  }
  // 5- password hashing
  const hashedPassword = bcrypt.hashSync(password, +process.env.SALT_ROUNDS);

  // 6- create new document in the database
  const newUser = await User.create({
    username,
    email,
    password: hashedPassword,
    age,
    role,
    phoneNumbers,
    addresses,
    test: req.body.test,
  });

  // 7- return the response
  res.status(201).json({
    success: true,
    message:
      "User created successfully, please check your email to verify your account",
    data: newUser,
  });
};

// ========================================= Verify Email API ================================//
/**
 * destructuring token from the request query
 * verify the token
 * get uset by email , isEmailVerified = false
 * if not return error user not found
 * if found
 * update isEmailVerified = true
 * return the response
 */
export const verifyEmail = async (req, res, next) => {
  const { token } = req.query;
  const decodedData = jwt.verify(token, process.env.JWT_SECRET_VERFICATION);
  // get uset by email , isEmailVerified = false
  const user = await User.findOneAndUpdate(
    {
      email: decodedData.email,
      isEmailVerified: false,
    },
    { isEmailVerified: true },
    { new: true }
  );
  if (!user) {
    return next(new Error("User not found", { cause: 404 }));
  }

  res.status(200).json({
    success: true,
    message: "Email verified successfully, please try to login",
  });
};

// ========================================= SignIn API ================================//

/**
 * destructuring the required data from the request body
 * get user by email and check if isEmailVerified = true
 * if not return error invalid login credentails
 * if found
 * check password
 * if not return error invalid login credentails
 * if found
 * generate login token
 * updated isLoggedIn = true  in database
 * return the response
 */

export const signIn = async (req, res, next) => {
  const { email, password } = req.body;
  // get user by email
  const user = await User.findOne({ email, isEmailVerified: true });
  if (!user) {
    return next(new Error("Invalid login credentails", { cause: 404 }));
  }
  // check password
  const isPasswordValid = bcrypt.compareSync(password, user.password);
  if (!isPasswordValid) {
    return next(new Error("Invalid login credentails", { cause: 404 }));
  }

  // generate login token
  const token = jwt.sign(
    { email, id: user._id, loggedIn: true },
    process.env.JWT_SECRET_LOGIN,
    { expiresIn: "1d" }
  );
  // updated isLoggedIn = true  in database

  user.isLoggedIn = true;
  await user.save();

  res.status(200).json({
    success: true,
    message: "User logged in successfully",
    data: {
      token,
    },
  });
};

export const loginWithGmail = async (req, res, next) => {
  // req.body.idToken
  const { idToken } = req.body;

  const client = new OAuth2Client();

  async function verify() {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.CLIENT_1_ID, // Specify the CLIENT_ID of the app that accesses the backend
      // Or, if multiple clients access the backend:
      //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
    });
    const payload = ticket.getPayload();
    return payload;
  }

  const result = await verify().catch(console.error);

  if (!result.email_verified)
    return next(
      new Error("Email not verified, please enter another google email", {
        cause: 400,
      })
    );

  // get user by email
  const user = await User.findOne({ email: result.email, provider: "GOOGLE" });
  if (!user) {
    return next(new Error("Invalid login credentails", { cause: 404 }));
  }
  // generate login token
  const token = jwt.sign(
    {
      email: result.email,
      id: user._id,
      loggedIn: true,
    },
    process.env.JWT_SECRET_LOGIN,
    { expiresIn: "1d" }
  );

  // updated isLoggedIn = true  in database
  user.isLoggedIn = true;
  await user.save();

  res.status(200).json({
    success: true,
    message: "User logged in successfully",
    data: {
      token,
    },
  });
};

export const signUpWithGmail = async (req, res, next) => {
  const { idToken } = req.body;

  const client = new OAuth2Client();

  async function verify() {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.CLIENT_1_ID, // Specify the CLIENT_ID of the app that accesses the backend
      // Or, if multiple clients access the backend:
      //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
    });
    const payload = ticket.getPayload();
    return payload;
  }

  const result = await verify().catch(console.error);

  if (!result.email_verified)
    return next(
      new Error("Email not verified, please enter another google email", {
        cause: 400,
      })
    );

  // 2- check if the user already exists in the database using the email
  const isEmailDuplicated = await User.findOne({ email: result.email });
  if (isEmailDuplicated) {
    return next(
      new Error("Email already exists,Please try another email", { cause: 409 })
    );
  }

  // 5- password hashing
  const randomPassword = Math.random().toString(36).slice(-8);
  const hashedPassword = bcrypt.hashSync(
    randomPassword,
    +process.env.SALT_ROUNDS
  );

  // 6- create new document in the database
  const newUser = await User.create({
    username: result.name,
    email: result.email,
    password: hashedPassword,
    isEmailVerified: true,
    provider: "GOOGLE",
  });

  // 7- return the response
  res.status(201).json({
    success: true,
    message:
      "User created successfully, please login and complete your profile",
    data: newUser,
  });
};

// ========================================= Update API ================================//

export const updateUser = async (req, res, next) => {
  const user = await User.findById(req.authUser._id);

  if (!user) {
    return next(new Error("User not found", 404));
  }

  const {
    username,
    email,
    password,
    phoneNumbers,
    addresses,
    role,
    isEmailVerified,
    age,
  } = req.body;

  if (username) {
    user.username = username;
  }
  if (email) {
    const emailExist = await User.findOne({ email });
    if (emailExist && emailExist._id.toString() !== user._id.toString()) {
      return next(new Error("Email already exists", 409));
    }
    user.email = email;
  }
  if (password) {
    user.password = password;
  }
  if (phoneNumbers) {
    user.phoneNumbers = phoneNumbers;
  }
  if (addresses) {
    user.addresses = addresses;
  }
  if (role) {
    user.role = role;
  }
  if (isEmailVerified !== undefined) {
    user.isEmailVerified = isEmailVerified;
  }
  if (age) {
    user.age = age;
  }

  await user.save();

  res.status(200).json({ message: "Done!", user });
};

// ========================================= Delete API ================================//

export const softDeleteUser = async (req, res, next) => {
  const userId = req.params.id;

  const user = await User.findById(userId);

  if (!user) {
    return next(new Error("User not found", 404));
  }

  // Mark the user as deleted
  user.deleted = true;
  user.deletedAt = new Date();

  await user.save();

  res.status(200).json({ message: "User soft-deleted successfully", user });
};

// ========================================= getprofile API ================================//

export const getUserProfile = async (req, res, next) => {
  const userId = req.authUser._id;

  const user = await User.findById(userId);

  if (!user) {
    return next(new Error("User not found", 404));
  }

  res.status(200).json(user);
};

// ========================================= UpdatePassword API ================================//

export const updatePassword = async (req, res, next) => {
  const userId = req.authUser._id;

  // Get old and new passwords from request body
  const { oldPassword, newPassword } = req.body;

  // Fetch user from the database
  const user = await User.findById(userId);

  // Check if the user exists
  if (!user) {
    return next(new Error("User not found", 404));
  }

  // Check if the old password matches the current password
  const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

  if (!isPasswordValid) {
    return next(new Error("Old password is incorrect", 400));
  }

  // Hash the new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  user.password = hashedPassword;

  await user.save();

  res.status(200).json({ message: "Password updated successfully" });
};

// ========================================= ForgetPassword API ================================//

export const forgetPassword = async (req, res, next) => {
  const { email } = req.body;
  const user = await userModel.findOne({ email });
  if (!user) {
    return next(new Error("Invalid ", { cause: 400 }));
  }
  const code = nanoid();
  const hashedCode = pkg.hashSync(code, +process.env.SALT_ROUNDS);
  const token = generateToken({
    payload: {
      email,
      sentCode:hashedCode,
    },
    signature: process.env.CONFIRMATION_RESET_TOKEN,
    expiresIn: "1h",
  });
  const resetpass = `${req.protocol}://${req.headers.host}/auth/rest/${token}`;
  const isEmailSent=sendEmailService(
  {  to:email,
    subject:"Reset Password",
    message:emailTemplate({
        link:resetpass,
        linkData:'Click to Reset your password',
        subject:"Reset Password"
    })}
  )
  if(!isEmailSent){
    return next(new Error ('Fail to sent reset Password ',{cause:400}))

  }
 const userUpdate= await userModel.findOneAndUpdate({email},{forgetgetCode:hashedCode},{new:true})
 res.status(200).json({message:"Done",userUpdate})

};

// ========================================= ResetPassword API ================================//
export const resetPassword = async (req, res, next) => {
    const {token}=req.params
    const decoded=verifyToken({token,signature:process.env.RESET_TOKEN})
    const user = await userModel.findOne({ emial:decoded?.email ,forgetgetCode:decoded?.sentCode});
    if (!user) {
      return next(new Error("You already reset your password ,try agin ", { cause: 400 }));
    }
  const{newPassword}=req.body
  user.password=newPassword
  user.forgetCode=null
  const resetedPass=await user.save()
   const userUpdate= await userModel.findOneAndUpdate({email},{forgetgetCode:hashedCode},{new:true})
   res.status(200).json({message:"Done",userUpdate})
  
  };
  