package com.milestone.dto;

import java.util.List;

/** Response DTOs. Shapes match what the frontend already consumes. */
public final class ApiDto {
    private ApiDto() {}

    public record UserDto(Long id, String name, String email) {}

    public record AuthResponse(String token, UserDto user) {}

    public record TaskDto(Long id, String title, boolean done) {}

    public record MilestoneDto(
            Long id, String title, int weight, String status, List<TaskDto> tasks) {}

    public record EventDto(Long id, String ts, String text) {}

    public record GoalDto(
            Long id,
            String title,
            String why,
            String targetDate,
            String createdAt,
            String difficulty,
            List<MilestoneDto> milestones,
            List<EventDto> events) {}
}
