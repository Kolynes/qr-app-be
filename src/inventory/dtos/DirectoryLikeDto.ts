import { DirectoryLikeEntity } from "../entities/DirectoryLikeEntity";
import { EDirectoryType } from "../types";

export default class DirectoryLikeDto {
  items?: DirectoryLikeEntity[];
  private constructor(directory: DirectoryLikeEntity) {
    Object.assign(this, directory);
  }

  static async create(directory: DirectoryLikeEntity): Promise<DirectoryLikeDto> {
    const dto = new DirectoryLikeDto(directory);
    if(directory.directoryType == EDirectoryType.folder)
      dto.items = await DirectoryLikeEntity.find({
        where: {
          folder: directory.id.toString()
        },
        withDeleted: false
      });
    return dto;
  }
}