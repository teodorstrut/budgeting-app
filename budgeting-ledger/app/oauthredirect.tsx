import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export default function OAuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/sync-settings');
    }
  }, [router]);

  return null;
}
