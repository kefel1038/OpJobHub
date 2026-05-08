import { Router, type IRouter } from "express";
import Stripe from "stripe";
import { authMiddleware, requireRole } from "../lib/auth";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY must be set.");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const router: IRouter = Router();

router.post(
  "/create-checkout-session",
  authMiddleware,
  requireRole("employer", "admin"),
  async (req, res) => {
    const origin =
      (typeof req.headers.origin === "string" ? req.headers.origin : null) ??
      `${req.protocol}://${req.get("host")}`;

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Featured Job Posting",
                description: "Post a featured job listing on the platform.",
              },
              unit_amount: 2000,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${origin}/post-job?status=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/post-job?status=cancel`,
        metadata: {
          userId: String(req.user!.id),
          email: req.user!.email,
        },
      });

      res.json({ url: session.url, id: session.id });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Stripe error";
      res.status(500).json({ error: message });
    }
  },
);

export default router;
