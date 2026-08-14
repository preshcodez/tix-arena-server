import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import User from "../modules/users/user.model";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: "/api/auth/google/callback",
    },
    async (_accessToken, _refreshToken, profile: Profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase();
        if (!email) {
          return done(new Error("Google account has no email"));
        }

        let user = await User.findOne({ email });

        if (user) {
          if (!user.googleId) {
            user.googleId = profile.id;
            await user.save();
          }
        } else {
          user = new User({
            firstName: profile.name?.givenName ?? "User",
            lastName: profile.name?.familyName ?? "",
            email,
            googleId: profile.id,
            isVerified: true,
          });
          await user.save();
        }

        return done(null, user);
      } catch (error) {
        return done(error as Error);
      }
    },
  ),
);

export default passport;
