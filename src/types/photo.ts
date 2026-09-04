export interface Photographer {
  name: string;
  username: string;
  profileUrl: string | null;
  avatarUrl: string | null;
}

export interface Photo {
  id: string;
  width: number;
  height: number;
  color: string;
  rawUrl: string;
  alt: string;
  description: string | null;
  likes: number;
  createdAt: string | null;
  tags: string[];
  unsplashUrl: string;
  photographer: Photographer;
}
