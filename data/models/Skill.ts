export default class Skill {
  key: string;
  name: string;
  description: string;
  level: number | null;

  constructor(key: string, { name, description, level }: { name: string; description: string; level?: number }) {
    this.key = key;
    this.name = name;
    this.description = description;
    this.level = level ?? null;
  }

  static fromJSON(key: string, data: { name: string; description: string; level?: number }): Skill {
    return new Skill(key, data);
  }
}
