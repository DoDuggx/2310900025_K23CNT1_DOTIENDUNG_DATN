package com.novamart.controller;

import com.novamart.dto.ChatDtos.ChatRequest;
import com.novamart.dto.ChatDtos.ChatResponse;
import com.novamart.service.GeminiService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/ai")
public class AiController {
    private final GeminiService geminiService;

    public AiController(GeminiService geminiService) {
        this.geminiService = geminiService;
    }

    @PostMapping("/chat")
    public ChatResponse chat(@Valid @RequestBody ChatRequest request) {
        return geminiService.chat(request.message().trim());
    }
}