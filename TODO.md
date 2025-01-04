# Paint JS Todo



## hash를 통해서 이미지 저장하는 거
hash를 통해서 이미지 저장하는 거 대신에
우선 들어가면 가장 최근에 수정한 그림 보여주게 할까?
나중에 어찌어찌 서버 만들어서 한다고 해도 그걸로 마이그레이션 하는 비용 생각하면 처음엔 뭣도 없는게 나을 것 같음
주소창엔 hash를 지우고 indexedDB에는 그대로 해시를 이용해서 이미지 저장해두자.

## i18n을 먼저 완벽히 구축 한 이후에 툴팁을 넣자.
i18n을 좀더 쉽게 할 수 있는 방안을 찾아봐야할 듯.
한국어 '저장'이 다른 언어(영어)로는 뭐뭐로 표시되는지. 한눈에 볼 수 있는 도구 필요함
  이건 object로 보여지게 하고. gpt를 사용해서 자유롭게 변역하고. 객체를 사용해서 쉽게 업데이트 가능한 형태면 좋을 듯

## 이후 계획
일단 4K 최적화는 나중에 하자.
지금 2d context로 할 수 있는건 거의 다했고 더한다해도 나중에 webgl을 사용할거라 낭비임
일단 코드최적화 해놓고 DI까지 해놓은 다음에 구조바꿀생각을 하자
지금은 일단 완성도 챙기다가 더 나올 아이디어도 있으니 그거 다 알고나서 webgl 적용시킬 생각 해야함





const canvases = document.querySelectorAll('canvas.main-canvas');

// 각각의 canvas를 투명하게 칠하기
canvases.forEach(canvas => {
  const ctx = canvas.getContext('2d'); // canvas의 2D context 가져오기
  ctx.clearRect(0, 0, canvas.width, canvas.height); // 기존 내용 지우기
  ctx.fillStyle = 'rgba(0, 0, 0, 0)'; // 투명 색 설정
  ctx.fillRect(0, 0, canvas.width, canvas.height); // canvas 전체를 투명 색으로 칠하기
});