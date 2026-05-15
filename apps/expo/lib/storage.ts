import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';

export type StorageBucket = 'avatars' | 'pets' | 'forum';

const OPTIMIZE_WIDTH = 1200;
const JPEG_QUALITY = 0.7;

async function optimizeImage(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: OPTIMIZE_WIDTH } }],
    { compress: JPEG_QUALITY, format: ImageManipulator.SaveFormat.JPEG }
  );
  return result.uri;
}

async function uriToArrayBuffer(uri: string): Promise<ArrayBuffer> {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error('Optimized image could not be read.');
  }
  return response.arrayBuffer();
}

/**
 * Resizes & compresses on-device, then uploads to a public Supabase Storage bucket.
 * @param uri Local file URI from the image picker
 * @param bucket Target bucket (`avatars`, `pets`, or `forum`)
 * @param storagePath Object path inside the bucket (e.g. `{userId}/123.jpg`)
 */
export async function uploadImage(
  uri: string,
  bucket: StorageBucket,
  storagePath: string
): Promise<string> {
  const optimizedUri = await optimizeImage(uri);
  const body = await uriToArrayBuffer(optimizedUri);

  const { error } = await supabase.storage.from(bucket).upload(storagePath, body, {
    contentType: 'image/jpeg',
    cacheControl: '3600',
    upsert: true,
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  return data.publicUrl;
}

export async function requestGalleryPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
}

/** Opens the gallery and returns a local URI, or null if cancelled / denied. */
export async function pickImageUri(): Promise<string | null> {
  const granted = await requestGalleryPermission();
  if (!granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 1,
  });

  if (result.canceled || !result.assets[0]?.uri) return null;
  return result.assets[0].uri;
}

export function buildAvatarPath(userId: string): string {
  return `${userId}/${Date.now()}.jpg`;
}

export function buildPetImagePath(userId: string, petId: string | number): string {
  return `${userId}/${petId}/${Date.now()}.jpg`;
}

export function buildForumImagePath(userId: string): string {
  return `${userId}/${Date.now()}.jpg`;
}

export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60) || 'konu';
}
