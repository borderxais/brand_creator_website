import { Metadata } from "next";
import { getServerSession } from "next-auth";
import AiVideoWelcome from "./AiVideoWelcome";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
  title: "AI Video | Cricher AI CreatorHub",
  description:
    "Browse this week's 90-second AI-built sample reels, bookmark what fits your audience, and unlock the Creator Pack to remix with your own script and voice.",
};

export default async function AiVideoPage() {
  const session = await getServerSession(authOptions);
  const creatorName = session?.user?.name?.split(" ")[0] ?? "Creator";

  return <AiVideoWelcome creatorName={creatorName} />;
}
