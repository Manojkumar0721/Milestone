package com.milestone.user;

import com.milestone.dto.ApiDto.AuthResponse;
import com.milestone.dto.ApiDto.UserDto;
import com.milestone.dto.Requests.LoginRequest;
import com.milestone.dto.Requests.RegisterRequest;
import com.milestone.security.JwtService;
import com.milestone.web.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    public AuthService(UserRepository users, PasswordEncoder encoder, JwtService jwt) {
        this.users = users;
        this.encoder = encoder;
        this.jwt = jwt;
    }

    public AuthResponse register(RegisterRequest req) {
        String email = req.email().trim().toLowerCase();
        if (users.existsByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "An account with this email already exists.");
        }
        User u = new User();
        u.setName(req.name().trim());
        u.setEmail(email);
        u.setPassword(encoder.encode(req.password()));
        users.save(u);
        return response(u);
    }

    public AuthResponse login(LoginRequest req) {
        String email = req.email().trim().toLowerCase();
        User u =
                users.findByEmail(email)
                        .filter(x -> encoder.matches(req.password(), x.getPassword()))
                        .orElseThrow(
                                () ->
                                        new ApiException(
                                                HttpStatus.UNAUTHORIZED,
                                                "Incorrect email or password."));
        return response(u);
    }

    public UserDto toDto(User u) {
        return new UserDto(u.getId(), u.getName(), u.getEmail());
    }

    private AuthResponse response(User u) {
        return new AuthResponse(jwt.generate(u.getId(), u.getEmail()), toDto(u));
    }
}
