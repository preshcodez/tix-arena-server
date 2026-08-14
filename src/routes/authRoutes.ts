import { Router } from "express";
import passport from "passport";
import { validate } from "../middlewares/validate";
import {
  registerSchema,
  verifyEmailSchema,
  loginSchema,
} from "../validation/authValidation";
import {
  register,
  verifyEmail,
  login,
  googleExchange,
} from "../controllers/authController";
import { createExchangeCode } from "../oauth/oauthExchange";
import { IUser } from "../models/userModel";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/verify-email", validate(verifyEmailSchema), verifyEmail);
router.post("/login", validate(loginSchema), login);

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL}/signin`,
  }),
  (req, res) => {
    const user = req.user as IUser;
    const code = createExchangeCode(user._id.toString());
    res.redirect(`${process.env.CLIENT_URL}/oauth-success?code=${code}`);
  },
);

router.post("/google/exchange", googleExchange);

export default router;
