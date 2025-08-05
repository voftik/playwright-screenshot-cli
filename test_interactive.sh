#!/bin/bash

# Тестируем интерактивный режим pscreen
# Автоматически отвечаем на вопросы

echo -e "httpbin.org\n1\nY\n9001\n" | pscreen
