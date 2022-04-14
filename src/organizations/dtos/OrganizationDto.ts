import { ObjectID } from "typeorm";
import UserDto from "../../auth/dtos/UserDto";
import { UserEntity } from "../../auth/entities/UserEntity";
import { OrganizationEntity } from "../entities/OrganizationEntity";

export default class OrganizationDto {
  id: ObjectID;
  name: string;
  owner!: UserDto;
  members!: UserDto[];

  private constructor(organization: OrganizationEntity) {
    this.id = organization.id;
    this.name = organization.name;
  }

  static async create(organization: OrganizationEntity): Promise<OrganizationDto> {
    const dto = new OrganizationDto(organization);
    dto.members = await Promise.all(
      organization.members.map(
        async member => (await UserEntity.findOne(member.id))!.toDto()
      )
    );
    dto.owner = dto.members.find(member => member.id.toString() == organization.owner)!;
    return dto;
  }
}