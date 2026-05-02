// id 末尾的随机后缀；4 位 base36 = ~1.7M 取值，按时间分桶后碰撞概率可忽略
export function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 6);
}
