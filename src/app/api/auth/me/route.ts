import { ok, problem } from "@/lib/api";
import { getUser } from "@/lib/auth";

export async function GET() { const user = await getUser(); return user ? ok({ id: user.id, email: user.email }) : problem(401, "unauthorized", "Authentication required"); }
