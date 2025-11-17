import HwpxViewer from "../src";

export default {
  title: "HWPXViewer/Basic",
};

export const Default = () => {
  const root = document.createElement("div");
  root.style.width = "100%";
  root.style.height = "100vh";
  root.style.background = "#E8EAED";

  setTimeout(async () => {
    try {
      const res = await fetch("gyeonggido-cheong.hwpx");
      if (!res.ok) throw new Error(`샘플 파일 로드 실패: ${res.status}`);
      const ab = await res.arrayBuffer();
      new HwpxViewer(root, new Uint8Array(ab));
    } catch (e) {
      const err = document.createElement("pre");
      err.textContent = (e as Error).message;
      err.style.color = "red";
      root.appendChild(err);
    }
  }, 0);

  return root;
};
