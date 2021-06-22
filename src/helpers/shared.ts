export enum RelationType {
  Follow = 1,
  Mute = 2,
  Block = 3,
}

export enum Gender {
  Everyone = 0,
  Male = 1,
  Female = 2,
  Other = 3,
}

export enum PostRelationType {
  Like = 1,
  Dislike = 2,
  Save = 3,
}

export interface PostPromotion {
  post_id: string;
  date: Date;
}
