import { Alert, Linking } from 'react-native';
import { getPetPublicBaseUrl } from './pet-public-url';

const CREATE_PET_PATH = '/create-pet';

export function getWebCreatePetUrl(): string {
  return `${getPetPublicBaseUrl()}${CREATE_PET_PATH}`;
}

export async function openWebCreatePetRegistration(): Promise<boolean> {
  const url = getWebCreatePetUrl();
  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert('Hata', 'Web adresi açılamadı.');
      return false;
    }
    await Linking.openURL(url);
    return true;
  } catch {
    Alert.alert('Hata', 'Web adresi açılamadı.');
    return false;
  }
}

/** Alert + optional browser open for add-pet entry points. */
export function promptWebCreatePetRegistration(): void {
  Alert.alert(
    'Blockchain Kaydı Web Üzerinden Yapılır',
    'Yeni evcil hayvan kaydı blockchain üzerinde oluşturulduğu için web sitesine yönlendirileceksiniz. Kayıt tamamlandıktan sonra evcil hayvanınız mobil uygulamada Evcil Hayvanlarım bölümünde görünecektir.',
    [
      { text: 'İptal', style: 'cancel' },
      {
        text: "Web'de Kayıt Oluştur",
        onPress: () => {
          void openWebCreatePetRegistration();
        },
      },
    ]
  );
}
