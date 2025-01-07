console.log("JS 실행:", "msgbox.js");

export function showMessageBox({ message, buttons }) {
  return new Promise((resolve) => {

      // 모달 컨테이너 생성
      const modal = document.createElement("div");
      Object.assign(modal.style, {
          position: "fixed",
          top: "0",
          left: "0",
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: "10000",
          opacity: "0",
          transition: "opacity 0.3s ease"
      });

      // 애니메이션을 위한 타임아웃
      setTimeout(() => {
          modal.style.opacity = "1";
      }, 10);

      // 모달 창 생성
      const modalBox = document.createElement("div");
      Object.assign(modalBox.style, {
          backgroundColor: "#fff",
          padding: "30px",
          borderRadius: "10px",
          width: "90%",
          maxWidth: "400px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
          textAlign: "center",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          animation: "slideDown 0.3s ease"
      });

      // 메시지 추가
      const messageElem = document.createElement("p");
      messageElem.textContent = message;
      Object.assign(messageElem.style, {
          fontSize: "16px",
          color: "#333",
          marginBottom: "20px"
      });
      modalBox.appendChild(messageElem);

      // 버튼 컨테이너 생성
      const buttonsContainer = document.createElement("div");
      Object.assign(buttonsContainer.style, {
          display: "flex",
          justifyContent: "center",
          gap: "10px",
          flexWrap: "wrap"
      });

      // 버튼 추가
      buttons.forEach((button) => {
          const buttonElem = document.createElement("button");
          buttonElem.textContent = button.label;
          Object.assign(buttonElem.style, {
              padding: "10px 20px",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "14px",
              transition: "background-color 0.2s ease, transform 0.2s ease",
              flex: "1 1 auto"
          });

          // 기본 버튼 스타일
          if (button.default) {
              Object.assign(buttonElem.style, {
                  backgroundColor: "#007BFF",
                  color: "#fff"
              });
              // 호버 효과
              buttonElem.onmouseover = () => {
                  buttonElem.style.backgroundColor = "#0056b3";
                  buttonElem.style.transform = "translateY(-2px)";
              };
              buttonElem.onmouseout = () => {
                  buttonElem.style.backgroundColor = "#007BFF";
                  buttonElem.style.transform = "translateY(0)";
              };
          } else {
              Object.assign(buttonElem.style, {
                  backgroundColor: "#f0f0f0",
                  color: "#333"
              });
              // 호버 효과
              buttonElem.onmouseover = () => {
                  buttonElem.style.backgroundColor = "#e0e0e0";
                  buttonElem.style.transform = "translateY(-2px)";
              };
              buttonElem.onmouseout = () => {
                  buttonElem.style.backgroundColor = "#f0f0f0";
                  buttonElem.style.transform = "translateY(0)";
              };
          }

          buttonElem.onclick = () => {
              resolve(button.value);  // 선택된 버튼의 값 반환
              // 페이드 아웃 애니메이션
              modal.style.opacity = "0";
              setTimeout(() => {
                  document.body.removeChild(modal);  // 모달 제거
              }, 300);
          };
          buttonsContainer.appendChild(buttonElem);
      });

      modalBox.appendChild(buttonsContainer);

      // 모달 창 구성
      modal.appendChild(modalBox);
      document.body.appendChild(modal);

      // 키보드 접근성: ESC 키로 모달 닫기
      const escFunction = (event) => {
          if (event.key === "Escape") {
              resolve(null); // ESC 키 눌렀을 때 null 반환
              modal.style.opacity = "0";
              setTimeout(() => {
                  document.body.removeChild(modal);
                  document.removeEventListener("keydown", escFunction);
              }, 300);
          }
      };
      document.addEventListener("keydown", escFunction);
  });
}
