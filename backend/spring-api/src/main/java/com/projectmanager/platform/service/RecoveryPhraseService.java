package com.projectmanager.platform.service;

import com.projectmanager.platform.security.InputSanitizer;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Locale;

@Service
public class RecoveryPhraseService {

    private static final String[] WORDS = {
        "amber", "brisa", "cobre", "delta", "ember", "faro", "globo", "helio",
        "indice", "jade", "kilo", "lumen", "marea", "nexus", "orion", "pulso",
        "quasar", "rio", "sable", "trama", "umbra", "vapor", "watt", "xenon",
        "yarda", "zenit"
    };

    private final SecureRandom secureRandom = new SecureRandom();
    private final InputSanitizer inputSanitizer;

    public RecoveryPhraseService(InputSanitizer inputSanitizer) {
        this.inputSanitizer = inputSanitizer;
    }

    public String generate() {
        return WORDS[secureRandom.nextInt(WORDS.length)]
            + "-"
            + WORDS[secureRandom.nextInt(WORDS.length)]
            + "-"
            + WORDS[secureRandom.nextInt(WORDS.length)];
    }

    public String normalize(String value) {
        return inputSanitizer.sanitizePlainText(value).toLowerCase(Locale.ROOT);
    }
}
