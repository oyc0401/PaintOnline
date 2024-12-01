import { observable, reaction ,configure} from 'mobx';

configure({ enforceActions: "never" }); // strict-mode 비활성화

const state = observable({
    count: 0,
    array:[4,5,6],
});

// `state.count`가 변화하면 실행
reaction(
    () => state.count, // 감시할 상태
    (newValue) => {
        console.log('카운트가 변경되었습니다:', newValue);
    }
);

reaction(
    () => state.array.slice(), // 감시할 상태
    (newValue) => {
        console.log('array가 변경되었습니다:', newValue);
    }
);

// 상태 변경
state.count += 1; // 출력: 카운트가 변경되었습니다: 1
state.count += 1; // 출력: 카운트가 변경되었습니다: 2


state.array.push(6);

state.array[1]=6; // set 트랩 동작안함

// state.array=[123];