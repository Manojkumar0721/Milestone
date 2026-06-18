package com.milestone.security;

/** Lightweight authenticated principal placed in the SecurityContext. */
public record AuthUser(Long id, String email) {}
