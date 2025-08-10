// utils/randomAuthor.js
const firstNames = ["John", "Emily", "Michael", "Sarah", "David", "Jessica", "Daniel", "Laura"];
const lastNames = ["Smith", "Johnson", "Brown", "Taylor", "Anderson", "Lee", "Martin", "Clark"];

export function getRandomAuthor() {
  const first = firstNames[Math.floor(Math.random() * firstNames.length)];
  const last = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${first} ${last}`;
}
