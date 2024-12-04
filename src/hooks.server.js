// src/hooks.server.js
import { redirect } from '@sveltejs/kit';

export async function handle({ event, resolve }) {
  const { pathname } = event.url;

  // 기본 경로("/")에서만 언어를 파악하여 리다이렉트
  if (pathname === '/') {
    const acceptLanguage = event.request.headers.get('accept-language') || '';
    const userLanguage = acceptLanguage.split(',')[0].toLowerCase();

    // 언어 코드에 따라 경로 결정
    let langRoute = 'en'; // 기본값
    if (userLanguage.startsWith('ko')) langRoute = 'ko';
    else if (userLanguage.startsWith('ja')) langRoute = 'ja';
    else if (userLanguage.startsWith('fr')) langRoute = 'fr';

    // 언어 경로로 리다이렉트
    throw redirect(302, `/${langRoute}`);
  }

  // 기본 요청 처리
  return resolve(event);
}