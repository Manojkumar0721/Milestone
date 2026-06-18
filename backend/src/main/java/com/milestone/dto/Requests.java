package com.milestone.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Request bodies with validation. */
public final class Requests {
    private Requests() {}

    public record RegisterRequest(
            @NotBlank String name,
            @NotBlank @Email String email,
            @NotBlank @Size(min = 4, message = "Password must be at least 4 characters") String password) {}

    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {}

    public record GoalRequest(
            @NotBlank String title, String why, String targetDate, String difficulty) {}

    public record MilestoneRequest(
            @NotBlank String title,
            @Min(1) @Max(5) Integer weight,
            String status) {}

    public record TaskRequest(String title, Boolean done) {}

    public record EventRequest(@NotBlank String text) {}
}
