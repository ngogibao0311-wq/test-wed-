// Bellum · Scene 06
(() => {
    'use strict';
    const scene = {
  "number": 6,
  "title": "PHÒNG NHẬT KÝ",
  "act": "HỒI II: BẢY CĂN PHÒNG",
  "background": "Bối cảnh/Thư phòng Bá tước.png",
  "cast": [
    "GIỌNG LUCIEN",
    "KAEL",
    "LYRA"
  ],
  "frames": [
    {
      "type": "narration",
      "text": "Sau khi rời hành lang gương, Kael và Lyra bước vào một căn phòng nhỏ.\nBên trong có bàn viết, giá sách và hàng trăm trang giấy bị xé.\nKael nhặt một cuốn nhật ký."
    },
    {
      "type": "narration",
      "text": "Tên trên bìa là Lucien Armand.\nAnh đọc."
    },
    {
      "type": "dialogue",
      "speaker": "GIỌNG LUCIEN",
      "text": "“Ngày thứ mười bốn của thí nghiệm.”",
      "image": "Lucien Armand.png",
      "side": "right"
    },
    {
      "type": "narration",
      "text": "“Cha Malach tin rằng cảm xúc có thể được tách khỏi linh hồn giống như chất độc được lọc khỏi máu.”\n“Ông ấy sai.”\n“Cảm xúc không nằm trong linh hồn.”"
    },
    {
      "type": "narration",
      "text": "“Cảm xúc là một phần hình dạng của linh hồn.”\nKael lật trang."
    },
    {
      "type": "dialogue",
      "speaker": "GIỌNG LUCIEN",
      "text": "“Bảy vật chủ đầu tiên đã chết.”",
      "image": "Lucien Armand.png",
      "side": "right"
    },
    {
      "type": "narration",
      "text": "“Vật chủ thứ tám sống sót trong bốn giờ. Anh ta không còn biết sợ, nhưng cũng không biết tránh nguy hiểm.”\n“Anh ta tự bước vào lửa.”\nLyra đứng quay lưng."
    },
    {
      "type": "dialogue",
      "speaker": "KAEL",
      "text": "Cô từng gặp Lucien?",
      "image": "Kael.png",
      "side": "left"
    },
    {
      "type": "dialogue",
      "speaker": "LYRA",
      "text": "Anh ấy là học trò của cha tôi.",
      "image": "Lyra Malach.png",
      "side": "right"
    },
    {
      "type": "dialogue",
      "speaker": "KAEL",
      "text": "Cô nói mình không nhớ cô gái trên đồng tiền.",
      "image": "Kael.png",
      "side": "left"
    },
    {
      "type": "dialogue",
      "speaker": "LYRA",
      "text": "Tôi không muốn nhớ.",
      "image": "Lyra Malach.png",
      "side": "right"
    },
    {
      "type": "narration",
      "text": "Kael tiếp tục đọc."
    },
    {
      "type": "dialogue",
      "speaker": "GIỌNG LUCIEN",
      "text": "“Lyra phát hiện căn phòng thí nghiệm.”",
      "image": "Lucien Armand.png",
      "side": "right"
    },
    {
      "type": "narration",
      "text": "“Cô ấy cầu xin tôi giúp ngăn nghi lễ.”\n“Nhưng tôi đã sợ.”\n“Ta luôn nghĩ sự hèn nhát là bỏ chạy khỏi nguy hiểm.”"
    },
    {
      "type": "narration",
      "text": "“Có lẽ hèn nhát còn là đứng yên khi biết điều đúng cần phải làm.”\nKael nhìn Lyra."
    },
    {
      "type": "dialogue",
      "speaker": "KAEL",
      "text": "Lucien đã bỏ cô lại?",
      "image": "Kael.png",
      "side": "left"
    },
    {
      "type": "dialogue",
      "speaker": "LYRA",
      "text": "Tất cả mọi người đều bỏ tôi lại.",
      "image": "Lyra Malach.png",
      "side": "right"
    },
    {
      "type": "narration",
      "text": "Một tiếng gõ vang lên từ phía trong tường.\nBa tiếng.\nDừng lại."
    },
    {
      "type": "narration",
      "text": "Ba tiếng nữa.\nKael gõ lại.\nMột viên gạch mở ra."
    },
    {
      "type": "narration",
      "text": "Bên trong là một mảnh kim loại hình tam giác.\nTrên đó khắc dòng chữ:\n“Không được tin người dẫn đường.”"
    },
    {
      "type": "narration",
      "text": "Kael giấu mảnh kim loại vào áo.\nLyra quay lại."
    },
    {
      "type": "dialogue",
      "speaker": "LYRA",
      "text": "Anh tìm thấy gì?",
      "image": "Lyra Malach.png",
      "side": "right"
    },
    {
      "type": "dialogue",
      "speaker": "KAEL",
      "text": "Chỉ là xương chuột.",
      "image": "Kael.png",
      "side": "left"
    }
  ]
};
    if (window.BellumScenes && typeof window.BellumScenes.register === 'function') {
        window.BellumScenes.register(scene);
    } else {
        window.__bellumPendingScenes = window.__bellumPendingScenes || [];
        window.__bellumPendingScenes.push(scene);
    }
})();
