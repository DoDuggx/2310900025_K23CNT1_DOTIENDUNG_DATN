package com.novamart.service;

import com.novamart.domain.AiConsultation;
import com.novamart.domain.Product;
import com.novamart.dto.ChatDtos.ChatResponse;
import com.novamart.exception.ApiException;
import com.novamart.repository.AiConsultationRepository;
import com.novamart.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;
import java.util.Map;

@Service
public class GeminiService {
    private final ProductRepository productRepository;
    private final AiConsultationRepository consultationRepository;
    private final String apiKey;
    private final String model;
    private final RestClient restClient = RestClient.create();

    public GeminiService(
        ProductRepository productRepository,
        AiConsultationRepository consultationRepository,
        @Value("${app.gemini.api-key:}") String apiKey,
        @Value("${app.gemini.model:gemini-2.5-flash}") String model
    ) {
        this.productRepository = productRepository;
        this.consultationRepository = consultationRepository;
        this.apiKey = apiKey;
        this.model = model;
    }

    @Transactional
    public ChatResponse chat(String message) {
        List<Product> products = productRepository.findTop10ByActiveTrueOrderByRatingDescCreatedAtDesc();
        String productContext = products.stream()
            .map(p -> "- " + p.getName() + " | " + p.getBrand() + " | "
                + p.getPrice() + " VND | tồn kho: " + p.getStockQty())
            .reduce((a, b) -> a + "\n" + b).orElse("Danh mục hiện chưa có sản phẩm.");
        String prompt = """
            Bạn là Nova, trợ lý tư vấn mua sắm của website NovaMart chuyên kinh doanh thiết bị công nghệ.
            Chỉ tư vấn trong phạm vi sản phẩm công nghệ, nhu cầu, ngân sách và thông tin cửa hàng.
            Không tự bịa giá hoặc tồn kho. Nếu không có dữ liệu phù hợp, hãy nói rõ và hỏi thêm nhu cầu.
            Trả lời bằng tiếng Việt, thân thiện, súc tích.

            Danh mục sản phẩm hiện có:
            %s

            Câu hỏi khách hàng: %s
            """.formatted(productContext, message);

        if (apiKey == null || apiKey.isBlank()) {
            String reply = "NovaMart đang chạy chế độ AI demo vì máy chủ chưa được cấu hình GEMINI_API_KEY. "
                + "Bạn có thể hỏi về laptop, điện thoại, âm thanh hoặc ngân sách để kiểm tra giao diện.";
            saveHistory(message, reply, "demo");
            return new ChatResponse(reply, "demo");
        }

        Map<String, Object> body = Map.of(
            "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt))))
        );
        try {
            Map<?, ?> response = restClient.post()
                .uri("https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}", model, apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(Map.class);
            String reply = extractText(response);
            saveHistory(message, reply, "gemini");
            return new ChatResponse(reply, "gemini");
        } catch (RestClientException ex) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Không gọi được Gemini API. Hãy kiểm tra API key và cấu hình máy chủ.");
        }
    }

    private void saveHistory(String message, String reply, String provider) {
        AiConsultation history = new AiConsultation();
        history.setMessage(message);
        history.setResponse(reply);
        history.setProvider(provider);
        consultationRepository.save(history);
    }

    private String extractText(Map<?, ?> response) {
        if (response == null || !(response.get("candidates") instanceof List<?> candidates) || candidates.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Gemini không trả về nội dung tư vấn.");
        }
        Object first = candidates.get(0);
        if (!(first instanceof Map<?, ?> candidate) || !(candidate.get("content") instanceof Map<?, ?> content)
            || !(content.get("parts") instanceof List<?> parts) || parts.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Định dạng phản hồi Gemini không hợp lệ.");
        }
        Object part = parts.get(0);
        if (!(part instanceof Map<?, ?> values) || !(values.get("text") instanceof String text) || text.isBlank()) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Gemini không tạo được câu trả lời.");
        }
        return text.trim();
    }
}