﻿using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HPEChat_Server.Migrations
{
    /// <inheritdoc />
    public partial class ServerMessageAttachmentImagePreview : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PreviewName",
                table: "Attachments",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PreviewName",
                table: "Attachments");
        }
    }
}
