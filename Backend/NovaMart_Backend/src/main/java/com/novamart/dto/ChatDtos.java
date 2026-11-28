package com.novamart.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class ChatDtos {
    private ChatDtos() {}

    public record ChatRequest(@NotBlank @Size(max = 2000) String message) {}
    public record ChatResponse(String reply, String provider) {}
}