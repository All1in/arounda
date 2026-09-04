export interface RawUnsplashUser {
  name?: string | null;
  username?: string | null;
  links?: { html?: string | null } | null;
  profile_image?: { small?: string | null; medium?: string | null; large?: string | null } | null;
}

export interface RawUnsplashTag {
  title?: string | null;
}

export interface RawUnsplashPhoto {
  id?: string | null;
  width?: number | null;
  height?: number | null;
  color?: string | null;
  created_at?: string | null;
  description?: string | null;
  alt_description?: string | null;
  likes?: number | null;
  urls?: { raw?: string | null; full?: string | null; regular?: string | null } | null;
  links?: { html?: string | null } | null;
  user?: RawUnsplashUser | null;
  tags?: RawUnsplashTag[] | null;
}

export interface RawUnsplashSearchResponse {
  total?: number | null;
  total_pages?: number | null;
  results?: RawUnsplashPhoto[] | null;
}
