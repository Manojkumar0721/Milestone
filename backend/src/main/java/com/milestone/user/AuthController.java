package com.milestone.user;

import com.milestone.dto.ApiDto.AuthResponse;
import com.milestone.dto.ApiDto.UserDto;
import com.milestone.dto.Requests.LoginRequest;
import com.milestone.dto.Requests.RegisterRequest;
import com.milestone.security.AuthUser;
import com.milestone.web.ApiException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService auth;
    private final UserRepository users;

    public AuthController(AuthService auth, UserRepository users) {
        this.auth = auth;
        this.users = users;
    }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest req) {
        return auth.register(req);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        return auth.login(req);
    }

    @GetMapping("/me")
    public UserDto me(@AuthenticationPrincipal AuthUser principal) {
        User u =
                users.findById(principal.id())
                        .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Not signed in."));
        return auth.toDto(u);
    }
}
