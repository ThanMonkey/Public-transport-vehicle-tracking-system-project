const tabLinks = document.querySelectorAll('.tab-link');
const tabContents = document.querySelectorAll('.tab-content');

tabLinks.forEach(button => {
  button.addEventListener('click', () => {
    // ลบ active จากทุกแท็บ
    tabLinks.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));

    // เพิ่ม active ให้แท็บที่คลิก
    button.classList.add('active');
    document.getElementById(button.dataset.tab).classList.add('active');
  });
});
