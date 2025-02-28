export type Creator = {
  id: string;
  bio: string | null;
  location: string | null;
  followers: number;
  engagementRate: number;
  user: {
    name: string | null;
    image: string | null;
    email: string | null;
  };
}
