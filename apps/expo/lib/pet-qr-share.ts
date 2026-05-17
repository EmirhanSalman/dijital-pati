import { Alert, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { buildPetPublicUrl } from './pet-public-url';

export async function copyPetPublicUrl(tokenId: string | number): Promise<boolean> {
  const url = buildPetPublicUrl(tokenId);
  await Clipboard.setStringAsync(url);
  Alert.alert('Kopyalandı', 'QR linki panoya kopyalandı.');
  return true;
}

export async function sharePetPublicUrl(
  tokenId: string | number,
  petName?: string | null
): Promise<void> {
  const url = buildPetPublicUrl(tokenId);
  const name = petName?.trim();
  await Share.share({
    message: name ? `${name} — DijitalPati QR: ${url}` : `DijitalPati QR: ${url}`,
    url,
    title: name ? `${name} QR` : 'DijitalPati QR',
  });
}
