import { observable, reaction ,configure,runInAction} from 'mobx';

configure({ enforceActions: "never" }); // strict-mode 비활성화
configure({ useProxies: "never" });
const state = observable({
     count: 5, array:[1,1,1]
});
function change(newState) {
    runInAction(() => {
        Object.assign(state, newState);
    });
}
// `state.count`가 변화하면 실행
reaction(
    () => state.count, // 감시할 상태
    (newValue) => {
        console.log('카운트가 변경되었습니다:', newValue);
    }
);

reaction(
    () => [state.count, state.array.slice()], // 여러 상태를 추적
    ([newCount, newArray]) => {
        console.log('count 또는 array가 변경되었습니다:', newCount, newArray);
    }
);

reaction(
    () => state.array.slice(), // 감시할 상태
    (newValue) => {
        console.log('array가 변경되었습니다:', newValue);
    }
);




const newState = { count: 7, array:[0,0,0]}

// 상태 변경
change(newState);

// 상태 변경
state.count += 1; // 출력: 카운트가 변경되었습니다: 1
state.count += 1; // 출력: 카운트가 변경되었습니다: 2


state.array.push(6);

state.array[1]=6; // set 트랩 동작안함

// state.array=[123];