"use client";

import { useRef, useState } from "react";

const PAGE_SIZE = 10; // 每页显示10个图片框

export default function MangaPagesUploader() {
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceIndexRef = useRef<number | null>(null);

  // 总页数
  const totalPages = Math.ceil(Math.max(images.length, 1) / PAGE_SIZE);

  // 当前分页的图片索引范围
  const startIdx = currentPage * PAGE_SIZE;

  // 处理文件选择
  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (replaceIndexRef.current !== null && files.length > 0) {
      // 替换单张
      const idx = replaceIndexRef.current;
      const newImages = images.slice();
      const newPreviews = previews.slice();
      newImages[idx] = files[0];
      newPreviews[idx] = URL.createObjectURL(files[0]);
      setImages(newImages);
      setPreviews(newPreviews);
      replaceIndexRef.current = null;
    } else {
      // 批量添加
      setImages([...images, ...files]);
      setPreviews([...previews, ...files.map(file => URL.createObjectURL(file))]);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // 删除某一页图片
  const handleDelete = (index: number) => {
    const newImages = images.slice();
    const newPreviews = previews.slice();
    newImages.splice(index, 1);
    newPreviews.splice(index, 1);
    setImages(newImages);
    setPreviews(newPreviews);
  };

  // 点击图片或空框替换
  const handleImageClick = (index: number) => {
    replaceIndexRef.current = index;
    fileInputRef.current?.click();
  };

  // 上一组/下一组
  const goPrev = () => setCurrentPage(p => Math.max(0, p - 1));
  const goNext = () => setCurrentPage(p => Math.min(totalPages - 1, p + 1));

  // 当前页要展示的图片（不足10个补空）
  const pageImages = [];
  for (let i = 0; i < PAGE_SIZE; i++) {
    const idx = startIdx + i;
    pageImages.push({
      src: previews[idx] || "",
      idx,
    });
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={handleFilesChange}
      />
      <div style={{ marginBottom: 16 }}>
        <button
          onClick={() => {
            replaceIndexRef.current = null;
            fileInputRef.current?.click();
          }}
        >
          批量添加页面图片
        </button>
      </div>
      <div style={{ margin: "16px 0", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <button onClick={goPrev} disabled={currentPage === 0}>上一组</button>
        <span style={{ margin: "0 16px" }}>第 {currentPage + 1} / {totalPages} 组</span>
        <button onClick={goNext} disabled={currentPage === totalPages - 1}>下一组</button>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 16,
          minHeight: 320,
        }}
      >
        {pageImages.map(({ src, idx }, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div
              style={{
                width: 110,
                height: 150,
                border: "1px dashed #ccc",
                borderRadius: 4,
                margin: "0 auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: src ? "#fff" : "#fafafa",
                cursor: "pointer",
                position: "relative",
              }}
              title={src ? "点击更换本页图片" : "点击上传图片"}
              onClick={() => handleImageClick(idx)}
            >
              {src ? (
                <img
                  src={src}
                  alt={`Page ${idx + 1}`}
                  style={{
                    width: 110,
                    height: 150,
                    objectFit: "cover",
                    borderRadius: 4,
                  }}
                />
              ) : (
                <span style={{ color: "#bbb" }}>点击上传</span>
              )}
              {src && (
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(idx); }}
                  style={{
                    position: "absolute",
                    top: 2,
                    right: 2,
                    background: "rgba(255,255,255,0.8)",
                    border: "none",
                    color: "red",
                    cursor: "pointer",
                    borderRadius: "50%",
                    width: 22,
                    height: 22,
                  }}
                  title="删除"
                >×</button>
              )}
            </div>
            <div style={{ marginTop: 4, fontSize: 14, color: "#666" }}>第{idx + 1}页</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 8, color: "#888" }}>
        <span>提示：每组10页，点击框可上传/替换，点击×可删除，支持批量添加。</span>
      </div>
    </div>
  );
}