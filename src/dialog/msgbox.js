function showMessageBox_implementation({ message, buttons }) {
    return new Promise((resolve) => {
        // 모달 컨테이너 생성
        const modal = document.createElement("div");
        modal.style.position = "fixed";
        modal.style.top = "0";
        modal.style.left = "0";
        modal.style.width = "100%";
        modal.style.height = "100%";
        modal.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
        modal.style.display = "flex";
        modal.style.alignItems = "center";
        modal.style.justifyContent = "center";
        modal.style.zIndex = "9999";

        // 모달 창 생성
        const modalBox = document.createElement("div");
        modalBox.style.backgroundColor = "#fff";
        modalBox.style.padding = "20px";
        modalBox.style.borderRadius = "8px";
        modalBox.style.width = "300px";
        modalBox.style.textAlign = "center";
        modalBox.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.1)";

        // 메시지 추가
        const messageElem = document.createElement("p");
        messageElem.textContent = message;
        modalBox.appendChild(messageElem);

        // 버튼 추가
        buttons.forEach((button) => {
            const buttonElem = document.createElement("button");
            buttonElem.textContent = button.label;
            buttonElem.style.margin = "5px";
            buttonElem.onclick = () => {
                resolve(button.value);  // 선택된 버튼의 값 반환
                document.body.removeChild(modal);  // 모달 제거
            };
            modalBox.appendChild(buttonElem);

            // 기본 버튼 설정
            if (button.default) {
                buttonElem.style.fontWeight = "bold";
            }
        });

        // 모달 창 구성
        modal.appendChild(modalBox);
        document.body.appendChild(modal);
    });
}

export {showMessageBox_implementation as showMessageBox };
