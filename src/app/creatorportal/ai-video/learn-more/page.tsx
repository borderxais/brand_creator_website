import { Metadata } from "next";
import { getServerSession } from "next-auth";
import AiVideoWelcome from "../AiVideoWelcome";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
  title: "How AI Video works | Cricher AI CreatorHub",
  description:
    "Sample reels, distribution channels, Creator Pack pricing and the full story behind Cricher's AI video generation.",
};

export default async function AiVideoLearnMorePage() {
  const session = await getServerSession(authOptions);
  const creatorName = session?.user?.name?.split(" ")[0] ?? "Creator";

  return <AiVideoWelcome creatorName={creatorName} />;
}
