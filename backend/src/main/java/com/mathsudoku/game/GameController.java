package com.mathsudoku.game;

import com.mathsudoku.security.AuthUser;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/game")
public class GameController {

    private final GameService gameService;

    public GameController(GameService gameService) {
        this.gameService = gameService;
    }

    @GetMapping("/levels/{level}")
    public LevelResponse getLevel(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable int level
    ) {
        return gameService.getLevel(user.id(), level);
    }

    @PostMapping("/levels/{level}/complete")
    public CompleteResponse completeLevel(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable int level,
            @Valid @RequestBody CompleteRequest request
    ) {
        return gameService.completeLevel(user.id(), level, request);
    }
}
