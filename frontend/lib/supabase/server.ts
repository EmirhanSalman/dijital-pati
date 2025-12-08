import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { slugify } from "@/lib/utils";

export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase environment variables bulunamadı! Lütfen .env.local dosyanıza şu satırları ekleyin:\n' +
      'NEXT_PUBLIC_SUPABASE_URL=your_supabase_url\n' +
      'NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key'
    );
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Cookie set edilemediyse sessizce devam et
        }
      },
    },
  });
}

export interface UserProfile {
  id: string;
  full_name: string | null;
  username: string | null;
  points: number;
  avatar_url: string | null;
  role: string | null;
  created_at: string | null;
  wallet_address?: string | null;
  email?: string;
}

export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return null;
    }

    // profiles tablosundan kullanıcı bilgilerini çek
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, username, points, avatar_url, role, created_at, wallet_address")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      // Eğer profil yoksa, auth user'dan temel bilgileri döndür
      return {
        id: user.id,
        full_name: user.user_metadata?.full_name || null,
        username: null,
        points: 0,
        avatar_url: null,
        role: null,
        created_at: user.created_at || null,
        wallet_address: null,
        email: user.email,
      };
    }

    return {
      ...profile,
      email: user.email,
    };
  } catch (error) {
    console.error("getUserProfile error:", error);
    return null;
  }
}

export async function isAdmin(): Promise<boolean> {
  try {
    const profile = await getUserProfile();
    return profile?.role === "admin";
  } catch (error) {
    console.error("isAdmin error:", error);
    return false;
  }
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string | null;
  };
}

export async function getAllNews(includeInactive = false): Promise<NewsItem[]> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("news")
      .select("*, profiles(full_name)")
      .order("created_at", { ascending: false });

    // Eğer includeInactive false ise, sadece aktif haberleri getir
    if (!includeInactive) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;

    if (error) {
      console.error("getAllNews error:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("getAllNews error:", error);
    return [];
  }
}

export async function getNewsById(id: string): Promise<NewsItem | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("news")
      .select("*, profiles(full_name)")
      .eq("id", id)
      .single();

    if (error) {
      console.error("getNewsById error:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("getNewsById error:", error);
    return null;
  }
}

export interface ForumPost {
  id: string;
  title: string;
  content: string;
  slug: string;
  user_id: string;
  category: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    username: string | null;
    avatar_url: string | null;
    full_name: string | null;
  };
  forum_votes?: Array<{
    vote_type: number;
    user_id: string;
  }>;
  score?: number;
  user_vote?: number;
}

export async function getForumPosts(
  search?: string,
  category?: string,
  sort: string = "newest"
): Promise<ForumPost[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let query = supabase
      .from("forum_posts")
      .select("*, profiles(username, avatar_url, full_name), forum_votes(vote_type, user_id)");

    if (category && category !== "Tümü") {
      query = query.eq("category", category);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    // Veritabanından önce tarihe göre sırala (her durumda)
    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error("getForumPosts error:", error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Her post için score ve user_vote hesapla
    const postsWithScore = data.map((post: any) => {
      const votes = post.forum_votes || [];
      const score = votes.reduce((acc: number, curr: any) => acc + (curr.vote_type || 0), 0);
      const userVote = user
        ? votes.find((v: any) => v.user_id === user.id)?.vote_type || 0
        : 0;

      // forum_votes'u kaldır, sadece score ve user_vote ekle
      const { forum_votes, ...postWithoutVotes } = post;

      return {
        ...postWithoutVotes,
        score,
        user_vote: userVote,
      };
    });

    // JavaScript ile sıralama yap
    if (sort === "popular") {
      // Score'a göre büyükten küçüğe sırala, eşitse tarihe göre
      return postsWithScore.sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score; // Score'a göre büyükten küçüğe
        }
        // Score'lar eşitse tarihe göre sırala (yeni önce)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    } else {
      // Tarihe göre sırala (zaten veritabanından geliyor ama emin olmak için)
      return postsWithScore.sort((a, b) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    }
  } catch (error) {
    console.error("getForumPosts error:", error);
    return [];
  }
}

export async function getForumPostBySlug(slug: string): Promise<ForumPost | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("forum_posts")
      .select("*, profiles(username, avatar_url, full_name, role), forum_votes(vote_type, user_id)")
      .eq("slug", slug)
      .single();

    if (error || !data) {
      console.error("getForumPostBySlug error:", error);
      return null;
    }

    const votes = data.forum_votes || [];
    const score = votes.reduce((acc: number, curr: any) => acc + (curr.vote_type || 0), 0);
    const userVote = user ? votes.find((v: any) => v.user_id === user.id)?.vote_type || 0 : 0;

    const { forum_votes, ...postWithoutVotes } = data;

    return {
      ...postWithoutVotes,
      score,
      user_vote: userVote,
    };
  } catch (error) {
    console.error("getForumPostBySlug error:", error);
    return null;
  }
}

interface CreateForumPostParams {
  title: string;
  content: string;
  category?: string;
}

export async function createForumPost(params: CreateForumPostParams): Promise<{ slug: string } | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error("Giriş yapmalısınız.");
    }

    const { title, content, category } = params;

    if (!title || !content) {
      throw new Error("Başlık ve içerik alanları zorunludur.");
    }

    const slug = `${slugify(title)}-${Date.now()}`;

    const { data, error } = await supabase
      .from("forum_posts")
      .insert({
        title: title.trim(),
        content: content.trim(),
        category: category || null,
        slug,
        user_id: user.id,
      })
      .select("slug")
      .single();

    if (error) {
      console.error("createForumPost error:", error);
      throw error;
    }

    return data ? { slug: data.slug } : null;
  } catch (error: any) {
    console.error("createForumPost error:", error);
    throw error;
  }
}

export async function getUserThreads(userId: string): Promise<ForumPost[]> {
  try {
    const supabase = await createClient();

    // Kullanıcının forum gönderilerini çek
    const { data: posts, error } = await supabase
      .from("forum_posts")
      .select("id, title, content, slug, user_id, category, created_at, updated_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("getUserThreads error:", error);
      return [];
    }

    if (!posts || posts.length === 0) {
      return [];
    }

    // Profil bilgilerini çek
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, full_name, avatar_url")
      .eq("id", userId)
      .single();

    // Oyları çek
    const postIds = posts.map((post) => post.id);
    const { data: votes } = await supabase
      .from("forum_votes")
      .select("post_id, vote_type")
      .in("post_id", postIds);

    // Her post için puan hesapla
    const scoresMap = new Map<string, number>();
    votes?.forEach((vote) => {
      const currentScore = scoresMap.get(vote.post_id) || 0;
      scoresMap.set(vote.post_id, currentScore + vote.vote_type);
    });

    return posts.map((post) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      slug: post.slug,
      user_id: post.user_id,
      category: post.category,
      created_at: post.created_at,
      updated_at: post.updated_at,
      profiles: profile
        ? {
            username: profile.username || null,
            avatar_url: profile.avatar_url || null,
            full_name: profile.full_name || null,
          }
        : undefined,
      score: scoresMap.get(post.id) || 0,
    }));
  } catch (error) {
    console.error("getUserThreads error:", error);
    return [];
  }
}

export interface ForumComment {
  id: string;
  content: string;
  post_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  author_username: string | null;
  author_full_name: string | null;
  author_avatar_url: string | null;
  profiles?: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export async function getComments(postId: string): Promise<ForumComment[]> {
  try {
    const supabase = await createClient();

    // Önce yorumları çek
    const { data: comments, error: commentsError } = await supabase
      .from("forum_comments")
      .select("id, content, post_id, user_id, created_at, updated_at")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (commentsError) {
      console.error("getComments - comments error:", JSON.stringify(commentsError, null, 2));
      return [];
    }

    if (!comments || comments.length === 0) {
      return [];
    }

    // Her yorum için kullanıcı bilgilerini ayrı ayrı çek
    const userIds = [...new Set(comments.map(c => c.user_id))];
    
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url")
      .in("id", userIds);

    if (profilesError) {
      console.error("getComments - profiles error:", JSON.stringify(profilesError, null, 2));
    }

    // Profil bilgilerini bir Map'e çevir
    const profilesMap = new Map(
      (profiles || []).map(profile => [
        profile.id,
        {
          username: profile.username || null,
          full_name: profile.full_name || null,
          avatar_url: profile.avatar_url || null,
        }
      ])
    );

    // Yorumları ve profil bilgilerini birleştir
    return comments.map((comment) => {
      const profile = profilesMap.get(comment.user_id);
      return {
        id: comment.id,
        content: comment.content,
        post_id: comment.post_id,
        user_id: comment.user_id,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        author_username: profile?.username || null,
        author_full_name: profile?.full_name || null,
        author_avatar_url: profile?.avatar_url || null,
        profiles: profile || undefined,
      };
    });
  } catch (error) {
    console.error("getComments - unexpected error:", error instanceof Error ? {
      message: error.message,
      stack: error.stack,
    } : error);
    return [];
  }
}

export interface Notification {
  id: string;
  user_id: string;
  type: "reply" | "lost_pet_found" | "mention" | "system";
  message: string;
  link: string | null;
  is_read: boolean;
  metadata: Record<string, any>;
  created_at: string;
}

export async function getNotifications(userId: string, limit: number = 20): Promise<Notification[]> {
  try {
    const supabase = await createClient();

    const { data: notifications, error } = await supabase
      .from("notifications")
      .select("id, user_id, type, message, link, is_read, metadata, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("getNotifications error:", error);
      return [];
    }

    if (!notifications || notifications.length === 0) {
      return [];
    }

    return notifications.map((notif) => ({
      id: notif.id,
      user_id: notif.user_id,
      type: notif.type as Notification["type"],
      message: notif.message,
      link: notif.link || null,
      is_read: notif.is_read,
      metadata: (notif.metadata as Record<string, any>) || {},
      created_at: notif.created_at,
    }));
  } catch (error) {
    console.error("getNotifications error:", error);
    return [];
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return false;
    }

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId)
      .eq("user_id", user.id);

    if (error) {
      console.error("markNotificationAsRead error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("markNotificationAsRead error:", error);
    return false;
  }
}

export interface AdminStats {
  totalUsers: number;
  totalNews: number;
  totalForumPosts: number;
  totalLostPets: number;
}

export async function getAdminStats(): Promise<AdminStats> {
  try {
    const supabase = await createClient();

    // Toplam kullanıcı sayısı
    const { count: userCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    // Toplam haber sayısı
    const { count: newsCount } = await supabase
      .from("news")
      .select("*", { count: "exact", head: true });

    // Toplam forum post sayısı
    const { count: forumCount } = await supabase
      .from("forum_posts")
      .select("*", { count: "exact", head: true });

    // Not: Kayıp hayvan sayısı blockchain'den alınmalı, şimdilik 0 döndürüyoruz
    // Production'da bu sayı blockchain'den çekilebilir
    const totalLostPets = 0;

    return {
      totalUsers: userCount || 0,
      totalNews: newsCount || 0,
      totalForumPosts: forumCount || 0,
      totalLostPets,
    };
  } catch (error) {
    console.error("getAdminStats error:", error);
    return {
      totalUsers: 0,
      totalNews: 0,
      totalForumPosts: 0,
      totalLostPets: 0,
    };
  }
}