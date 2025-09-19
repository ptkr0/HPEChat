using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HPEChat_Server.Migrations
{
    /// <inheritdoc />
    public partial class TrueDeleteAndIndexOnServerName : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "ServerMessages");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "PrivateMessages");

            migrationBuilder.CreateIndex(
                name: "IX_Servers_Name",
                table: "Servers",
                column: "Name",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Servers_Name",
                table: "Servers");

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "ServerMessages",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "PrivateMessages",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }
    }
}
