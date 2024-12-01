import { makeState } from 'reactive-link';

// 초기 상태 스토어 생성
const state = makeState({ count: 0 });

// 이벤트와 상태 변경 동작 바인딩
state.bindEvents({
  countChanged: { action: 'set', prop: 'count' }, // 'countChanged' -> count 변경
});

// 상태 변경 이벤트 리스너 등록
state.on('countChanged', (newValue) => {
  console.log('카운트가 변경되었습니다:', newValue);
});

// 상태 변경 (트리거: countChanged)
state.count++; // 출력: 카운트가 변경되었습니다: 1