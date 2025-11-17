import HWPViewer from "../src";

export default {
  title: "Viewer/Basic",
};

export const Default = () => {
  const root = document.createElement("div");
  root.style.width = "100%";
  root.style.height = "100vh";
  root.style.background = "#E8EAED";

  // 렌더 이후에 Viewer 초기화
  setTimeout(async () => {
    try {
      const res = await fetch("noori.hwp");
      if (!res.ok) {
        throw new Error(`샘플 파일 로드 실패: ${res.status}`);
      }
      const ab = await res.arrayBuffer();
      // cfb가 ArrayBuffer/Uint8Array도 처리 가능. options.type은 'array' 사용
      new HWPViewer(root, new Uint8Array(ab), { type: "array" });
    } catch (e) {
      const err = document.createElement("pre");
      err.textContent = (e as Error).message;
      err.style.color = "red";
      root.appendChild(err);
    }
  }, 0);

  return root;
};

export const HWPXFile = () => {
  const root = document.createElement("div");
  root.style.width = "100%";
  root.style.height = "100vh";
  root.style.background = "#E8EAED";

  // 렌더 이후에 Viewer 초기화
  setTimeout(async () => {
    try {
      const res = await fetch("gyeonggido-cheong.hwpx");
      if (!res.ok) {
        throw new Error(`샘플 파일 로드 실패: ${res.status}`);
      }
      const ab = await res.arrayBuffer();
      // cfb가 ArrayBuffer/Uint8Array도 처리 가능. options.type은 'array' 사용
      new HWPViewer(root, new Uint8Array(ab), { type: "array" });
    } catch (e) {
      const err = document.createElement("pre");
      err.textContent = (e as Error).message;
      err.style.color = "red";
      root.appendChild(err);
    }
  }, 0);

  return root;
};
