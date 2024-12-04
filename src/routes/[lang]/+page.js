// src/routes/[lang]/+page.server.js
import { error } from '@sveltejs/kit';
import { localization} from '$src/localize/localization'
import {i18n} from '$src/localize/localize'
// 번역 데이터 (예시)
// const translations = {
//   en: { greeting: 'Hello', description: 'Welcome to our site!' },
//   ko: { greeting: '안녕하세요', description: '우리 사이트에 오신 것을 환영합니다!' },
//   fr: { greeting: 'Bonjour', description: 'Bienvenue sur notre site!' }
// };
export function entries() {
  return [
    { lang: 'en' },
    { lang: 'ko' },
    { lang: 'ja' },
  ];
}

export const prerender = true;

export async function load({ params }) {
  
  const { lang } = params;

  // 지원하지 않는 언어 처리
  if (!localization[lang]) {
    console.error('Language not supported')
    throw error(404, 'Language not supported');
  }

  i18n.lang = lang;

  console.log('server lang:')

  // 번역된 텍스트를 반환
  return {
      lang:lang,
      translation: localization[lang]
  };
}
